import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RestaurantAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const load = async () => {
    const { data } = await supabase.from("restaurant_reservations").select("*").eq("reservation_date", date).order("reservation_time");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, [date]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("restaurant_reservations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const totalCovers = list.reduce((s, r) => s + r.party_size, 0);

  return (
    <AdminLayout eyebrow="Dining" title="Restaurant Manager">
      <div className="flex items-center gap-6 mb-8">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-white/[0.03] border border-white/10 text-neutral-100 px-3 py-2 text-sm" />
        <div className="text-xs uppercase tracking-[0.25em] text-neutral-400">
          {list.length} reservations · <span className="text-amber-200">{totalCovers} covers</span>
        </div>
      </div>

      <div className="rounded-sm border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.25em] text-neutral-400">
            <tr>{["Time","Guest","Party","Venue","Requests","Status","Actions"].map(h => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-display text-lg">{r.reservation_time.slice(0,5)}</td>
                <td className="px-4 py-3">
                  <div>{r.guest_name}</div>
                  <div className="text-xs text-neutral-500">{r.guest_email}</div>
                </td>
                <td className="px-4 py-3">{r.party_size}</td>
                <td className="px-4 py-3 text-neutral-400">{r.venue}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs max-w-xs">{r.special_requests}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-amber-200/10 text-amber-200">{r.status}</span></td>
                <td className="px-4 py-3 space-x-2">
                  {["seated","completed","no_show","cancelled"].map(s => (
                    <button key={s} onClick={() => update(r.id, s)}
                      className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/10 text-neutral-300 hover:border-amber-200 hover:text-amber-200">
                      {s.replace("_"," ")}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-neutral-500">No reservations for this date.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
