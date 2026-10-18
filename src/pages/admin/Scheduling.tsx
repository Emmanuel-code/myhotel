import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AppRole } from "@/hooks/useRoles";
import { Plus, ChevronLeft, ChevronRight, X, AlertTriangle } from "lucide-react";

const ROLES: AppRole[] = ["front_desk", "housekeeping", "restaurant", "spa", "marketing", "gm"];
const ROLE_COLORS: Record<string, string> = {
  front_desk: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  housekeeping: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  restaurant: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  spa: "bg-violet-500/15 text-violet-300 border-violet-500/40",
  marketing: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  gm: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
  owner: "bg-amber-200/20 text-amber-200 border-amber-200/40",
};
const SHIFT_TEMPLATES: { label: string; start: string; end: string }[] = [
  { label: "Morning", start: "06:00", end: "14:00" },
  { label: "Afternoon", start: "14:00", end: "22:00" },
  { label: "Night", start: "22:00", end: "06:00" },
  { label: "Day", start: "09:00", end: "17:00" },
];

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toIso(d: Date) { return d.toISOString().slice(0, 10); }

export default function Scheduling() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [shifts, setShifts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState<{ open: boolean; date?: string; role?: AppRole }>({ open: false });
  const [form, setForm] = useState({
    role: "front_desk" as AppRole, assigned_to: "", start_time: "09:00", end_time: "17:00", notes: "",
  });

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const from = toIso(days[0]);
  const to = toIso(days[6]);

  const load = async () => {
    const [{ data: s }, { data: roles }] = await Promise.all([
      supabase.from("shifts").select("*").gte("shift_date", from).lte("shift_date", to).order("start_time"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setShifts(s ?? []);
    const ids = [...new Set((roles ?? []).map((r: any) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids);
      const byId: any = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
      setStaff((roles ?? []).map((r: any) => ({ ...byId[r.user_id], user_id: r.user_id, role: r.role })));
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  useEffect(() => {
    const ch = supabase
      .channel("shifts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [from, to]);

  const openSlot = (date: string, role?: AppRole) => {
    const tmpl = SHIFT_TEMPLATES[0];
    setForm({ role: role ?? "front_desk", assigned_to: "", start_time: tmpl.start, end_time: tmpl.end, notes: "" });
    setOpen({ open: true, date, role });
  };

  const save = async () => {
    if (!open.date) return;
    const assignee = staff.find((s) => s.user_id === form.assigned_to && s.role === form.role);
    const payload: any = {
      shift_date: open.date,
      role: form.role,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes || null,
    };
    if (form.assigned_to) {
      payload.assigned_to = form.assigned_to;
      payload.assigned_name = assignee
        ? `${assignee.first_name ?? ""} ${assignee.last_name ?? ""}`.trim() || assignee.email
        : null;
    }
    const { error } = await supabase.from("shifts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Shift created");
    setOpen({ open: false });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("shifts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Shift removed");
  };

  const assignShift = async (id: string, user_id: string, role: string) => {
    const assignee = staff.find((s) => s.user_id === user_id && s.role === role);
    const { error } = await supabase.from("shifts").update({
      assigned_to: user_id || null,
      assigned_name: assignee ? (`${assignee.first_name ?? ""} ${assignee.last_name ?? ""}`.trim() || assignee.email) : null,
    }).eq("id", id);
    if (error) return toast.error(error.message);
  };

  const eligibleStaff = (role: AppRole) => staff.filter((s) => s.role === role || s.role === "gm" || s.role === "owner");

  return (
    <AdminLayout eyebrow="Operations" title="Staff Scheduling">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="w-9 h-9 border border-white/10 hover:border-amber-200 hover:text-amber-200 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
          <div className="font-display text-2xl">
            {days[0].toLocaleDateString(undefined, { month: "long", day: "numeric" })} – {days[6].toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="w-9 h-9 border border-white/10 hover:border-amber-200 hover:text-amber-200 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="ml-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:border-amber-200">Today</button>
        </div>
        <div className="text-xs text-neutral-500">{shifts.length} shifts this week</div>
      </div>

      <div className="rounded-sm border border-white/5 overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(7, minmax(0, 1fr))` }}>
          <div className="bg-white/[0.04] px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-neutral-400 border-b border-white/5">Role</div>
          {days.map((d) => (
            <div key={d.toString()} className="bg-white/[0.04] px-3 py-3 border-b border-l border-white/5 text-[10px] uppercase tracking-[0.25em] text-neutral-400">
              <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div className="font-display text-xl text-neutral-100 normal-case tracking-normal">{d.getDate()}</div>
            </div>
          ))}

          {ROLES.map((role) => (
            <RoleRow key={role} role={role} days={days} shifts={shifts.filter((s) => s.role === role)}
              onAdd={(date) => openSlot(date, role)}
              onRemove={remove}
              onAssign={assignShift}
              eligible={eligibleStaff(role)} />
          ))}
        </div>
      </div>

      <CoverageSummary days={days} shifts={shifts} />

      <Dialog open={open.open} onOpenChange={(o) => !o && setOpen({ open: false })}>
        <DialogContent className="bg-[#0d0d10] border-white/10 text-neutral-100">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New shift · {open.date && new Date(open.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole, assigned_to: "" })}
                  className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2">
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Template</label>
                <select onChange={(e) => {
                  const t = SHIFT_TEMPLATES.find((x) => x.label === e.target.value);
                  if (t) setForm({ ...form, start_time: t.start, end_time: t.end });
                }} className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2">
                  {SHIFT_TEMPLATES.map((t) => <option key={t.label} value={t.label}>{t.label} ({t.start}–{t.end})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Start</label>
                <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2 text-neutral-100" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">End</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2 text-neutral-100" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Assign to (optional)</label>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2">
                <option value="">Leave open for any {form.role.replace("_", " ")}</option>
                {eligibleStaff(form.role).map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {(s.first_name ?? "") + " " + (s.last_name ?? "") || s.email} {s.role !== form.role ? `· ${s.role}` : ""}
                  </option>
                ))}
              </select>
              {eligibleStaff(form.role).length === 0 && (
                <p className="text-xs text-amber-300 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> No staff carry the {form.role.replace("_", " ")} role yet. Grant it under Staff &amp; Roles.
                </p>
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2 text-neutral-100" />
            </div>
            <button onClick={save} className="w-full py-2.5 text-[11px] uppercase tracking-[0.25em] bg-amber-200 text-black hover:bg-amber-100">
              Create shift
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function RoleRow({
  role, days, shifts, onAdd, onRemove, onAssign, eligible,
}: {
  role: AppRole; days: Date[]; shifts: any[];
  onAdd: (date: string) => void;
  onRemove: (id: string) => void;
  onAssign: (id: string, user_id: string, role: string) => void;
  eligible: any[];
}) {
  return (
    <>
      <div className="px-4 py-4 border-b border-white/5 bg-white/[0.015]">
        <div className={`inline-block px-2 py-1 text-[10px] uppercase tracking-[0.2em] border ${ROLE_COLORS[role] ?? "border-white/10"}`}>
          {role.replace("_", " ")}
        </div>
      </div>
      {days.map((d) => {
        const date = toIso(d);
        const cell = shifts.filter((s) => s.shift_date === date);
        return (
          <div key={date} className="border-b border-l border-white/5 p-2 min-h-[110px] hover:bg-white/[0.02] group">
            <div className="space-y-1.5">
              {cell.map((s) => (
                <div key={s.id} className={`p-2 text-[11px] border ${ROLE_COLORS[role]} relative`}>
                  <button onClick={() => onRemove(s.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-300">
                    <X className="w-3 h-3" />
                  </button>
                  <div className="font-mono">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</div>
                  {s.assigned_name ? (
                    <div className="mt-0.5 truncate">{s.assigned_name}</div>
                  ) : (
                    <select value="" onChange={(e) => e.target.value && onAssign(s.id, e.target.value, role)}
                      className="w-full mt-1 bg-black/40 border border-white/10 text-[10px] px-1 py-0.5 text-neutral-300">
                      <option value="">Unassigned</option>
                      {eligible.map((p) => (
                        <option key={p.user_id} value={p.user_id}>
                          {(p.first_name ?? "") + " " + (p.last_name ?? "") || p.email}
                        </option>
                      ))}
                    </select>
                  )}
                  {s.notes && <div className="text-neutral-500 mt-0.5 truncate">{s.notes}</div>}
                </div>
              ))}
            </div>
            <button onClick={() => onAdd(date)}
              className="w-full mt-1 py-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500 hover:text-amber-200 border border-dashed border-white/5 hover:border-amber-200/40 flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        );
      })}
    </>
  );
}

function CoverageSummary({ days, shifts }: { days: Date[]; shifts: any[] }) {
  const totalHours = shifts.reduce((sum, s) => {
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    return sum + mins / 60;
  }, 0);
  const unassigned = shifts.filter((s) => !s.assigned_to).length;
  return (
    <div className="grid grid-cols-3 gap-4 mt-8">
      <Tile label="Total scheduled hours" value={`${Math.round(totalHours)}h`} />
      <Tile label="Open / unassigned" value={String(unassigned)} accent={unassigned > 0 ? "text-amber-300" : ""} />
      <Tile label="Shifts" value={String(shifts.length)} />
    </div>
  );
}
function Tile({ label, value, accent = "text-amber-200" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-sm border border-white/5 bg-white/[0.02] p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">{label}</div>
      <div className={`font-display text-3xl mt-2 ${accent}`}>{value}</div>
    </div>
  );
}
