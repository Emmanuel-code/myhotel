import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Plus, UserPlus, CheckCircle2 } from "lucide-react";

const STATUSES = ["clean", "dirty", "inspected", "occupied", "out_of_order"] as const;
const TASK_TYPES = ["turnover", "stayover", "deep_clean", "linen", "maintenance", "inspection"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const COLORS: Record<string, string> = {
  clean: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  dirty: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  inspected: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  occupied: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  out_of_order: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};

export default function Housekeeping() {
  const { user } = useAuth();
  const [units, setUnits] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [tab, setTab] = useState<"open" | "in_progress" | "done">("open");
  const [newTask, setNewTask] = useState<{ open: boolean; unitId?: string }>({ open: false });
  const [form, setForm] = useState({ task_type: "turnover", priority: "normal", notes: "", due_at: "" });

  const load = async () => {
    const [{ data: u }, { data: t }, { data: roles }] = await Promise.all([
      supabase.from("room_units").select("*").order("unit_number"),
      supabase.from("housekeeping_tasks").select("*, room_units(unit_number, room_name)").order("due_at"),
      supabase.from("user_roles").select("user_id").in("role", ["housekeeping", "gm", "owner"]),
    ]);
    setUnits(u ?? []); setTasks(t ?? []);
    const ids = [...new Set((roles ?? []).map((r: any) => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids);
      setStaff(profs ?? []);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel("hk-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_units" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "housekeeping_tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const setUnitStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("room_units").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
  };

  const assignTask = async (id: string, assigned_to: string | null) => {
    const { error } = await supabase.from("housekeeping_tasks")
      .update({ assigned_to, status: assigned_to ? "in_progress" : "pending" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(assigned_to ? "Task assigned" : "Task unassigned");
  };

  const setTaskStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "done") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("housekeeping_tasks").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Task ${status.replace("_", " ")}`);
  };

  const claimTask = async (id: string) => {
    if (!user) return;
    await assignTask(id, user.id);
  };

  const createTask = async () => {
    if (!newTask.unitId) return;
    const { error } = await supabase.from("housekeeping_tasks").insert({
      room_unit_id: newTask.unitId,
      task_type: form.task_type,
      priority: form.priority,
      notes: form.notes || null,
      due_at: form.due_at || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Task created");
    setNewTask({ open: false });
    setForm({ task_type: "turnover", priority: "normal", notes: "", due_at: "" });
  };

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: units.filter((u) => u.status === s).length }), {} as any);
  const staffName = (uid: string) => {
    const s = staff.find((x) => x.id === uid);
    return s ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.email : uid.slice(0, 8);
  };

  const tabFilter = (t: any) => {
    if (tab === "open") return t.status === "pending";
    if (tab === "in_progress") return t.status === "in_progress";
    return t.status === "done";
  };
  const visibleTasks = tasks.filter(tabFilter);

  return (
    <AdminLayout eyebrow="Operations · Live" title="Housekeeping">
      <div className="grid grid-cols-5 gap-4 mb-8">
        {STATUSES.map((s) => (
          <div key={s} className={`p-4 rounded-sm border ${COLORS[s]}`}>
            <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">{s.replace("_", " ")}</div>
            <div className="font-display text-3xl mt-1">{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live Room Board
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {units.map((u) => (
            <div key={u.id} className={`p-3 rounded-sm border ${COLORS[u.status]} relative group`}>
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 truncate">{u.room_name.split(" ")[0]}</div>
              <div className="font-display text-xl mt-1">#{u.unit_number}</div>
              <select value={u.status} onChange={(e) => setUnitStatus(u.id, e.target.value)}
                className="w-full mt-2 bg-black/40 text-[10px] uppercase tracking-wider px-1 py-1 border border-white/10">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              <button onClick={() => setNewTask({ open: true, unitId: u.id })}
                title="Add task"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-black/60 border border-white/10 hover:bg-amber-200/20">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">Task Queue</div>
          <div className="flex gap-2">
            {(["open", "in_progress", "done"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${tab === t ? "border-amber-200 text-amber-200" : "border-white/10 text-neutral-400 hover:text-neutral-100"}`}>
                {t.replace("_", " ")} ({tasks.filter((x) => (t === "open" ? x.status === "pending" : t === "in_progress" ? x.status === "in_progress" : x.status === "done")).length})
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {visibleTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-4 rounded-sm border border-white/5 bg-white/[0.02]">
              <div className="font-mono text-xs text-amber-200/80 w-20">#{t.room_units?.unit_number}</div>
              <div className="flex-1">
                <div className="text-sm flex items-center gap-2">
                  <span className="capitalize">{t.task_type.replace("_", " ")}</span>
                  <span className={`text-[10px] uppercase tracking-[0.2em] px-1.5 py-0.5 border ${t.priority === "urgent" ? "border-rose-400/50 text-rose-300" :
                    t.priority === "high" ? "border-amber-400/50 text-amber-300" :
                      "border-white/10 text-neutral-500"
                    }`}>{t.priority}</span>
                </div>
                {t.notes && <div className="text-xs text-neutral-500 mt-1">{t.notes}</div>}
              </div>
              <div className="text-xs text-neutral-500 w-40">{t.due_at ? new Date(t.due_at).toLocaleString() : "no due date"}</div>
              <div className="w-44">
                <select value={t.assigned_to ?? ""} onChange={(e) => assignTask(t.id, e.target.value || null)}
                  className="w-full bg-black/40 border border-white/10 text-xs px-2 py-1 text-neutral-300">
                  <option value="">Unassigned</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{staffName(s.id)}</option>)}
                </select>
              </div>
              {tab !== "done" && !t.assigned_to && user && (
                <button onClick={() => claimTask(t.id)} title="Claim this task"
                  className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] border border-sky-400/40 text-sky-300 hover:bg-sky-400/10 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Claim
                </button>
              )}
              {t.status !== "done" && (
                <button onClick={() => setTaskStatus(t.id, "done")}
                  className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] border border-amber-200/40 text-amber-200 hover:bg-amber-200/10 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Done
                </button>
              )}
            </div>
          ))}
          {visibleTasks.length === 0 && (
            <div className="text-center py-12 text-neutral-500">Nothing here.</div>
          )}
        </div>
      </div>

      <Dialog open={newTask.open} onOpenChange={(o) => !o && setNewTask({ open: false })}>
        <DialogContent className="bg-[#0d0d10] border-white/10 text-neutral-100">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-[0.25em] text-amber-200/80">
              Room #{units.find((u) => u.id === newTask.unitId)?.unit_number}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Type</label>
                <select value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2">
                  {TASK_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Due</label>
              <input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2 text-neutral-100" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                className="w-full mt-1 bg-black/40 border border-white/10 text-sm px-3 py-2 text-neutral-100" />
            </div>
            <button onClick={createTask} className="w-full py-2.5 text-[11px] uppercase tracking-[0.25em] bg-amber-200 text-black hover:bg-amber-100">
              Create task
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
