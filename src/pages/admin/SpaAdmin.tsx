import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SpaAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const load = async () => {
    const { data } = await supabase.from("spa_appointments").select("*").eq("appointment_date", date).order("appointment_time");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, [date]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("spa_appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const revenue = list.reduce((s, a) => s + (a.price ?? 0), 0);

  return (
    <AdminLayout eyebrow="Wellness" title="Spa Manager">
      <div className="flex items-center gap-6 mb-8">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-white/[0.03] border border-white/10 text-neutral-100 px-3 py-2 text-sm" />
        <div className="text-xs uppercase tracking-[0.25em] text-neutral-400">
          {list.length} appointments · <span className="text-amber-200">₵{revenue.toLocaleString()} booked</span>
        </div>
      </div>

      <div className="grid gap-3">
        {list.map(a => (
          <div key={a.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-white/5 rounded-sm bg-white/[0.02]">
            <div className="col-span-1 font-display text-2xl">{a.appointment_time.slice(0, 5)}</div>
            <div className="col-span-3">
              <div className="text-sm">{a.guest_name}</div>
              <div className="text-xs text-neutral-500">{a.guest_email}</div>
            </div>
            <div className="col-span-3 text-sm text-neutral-300">{a.treatment}</div>
            <div className="col-span-2 text-xs text-neutral-500">{a.therapist} · {a.duration_minutes}min</div>
            <div className="col-span-1 text-amber-200 text-sm">₵{a.price}</div>
            <div className="col-span-2 text-right space-x-2">
              {["confirmed", "completed", "cancelled"].map(s => (
                <button key={s} onClick={() => update(a.id, s)}
                  className={`px-2 py-1 text-[10px] uppercase tracking-wider border ${a.status === s ? "border-amber-200 text-amber-200" : "border-white/10 text-neutral-400 hover:text-neutral-100"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-center py-16 text-neutral-500">No appointments today.</div>}
      </div>
    </AdminLayout>
  );
}
