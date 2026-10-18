import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Marketing() {
  const [promos, setPromos] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", title: "", description: "", discount_pct: 10, audience: "all", active: true });

  const load = async () => {
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromos(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { error } = await supabase.from("promotions").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Campaign created");
    setForm({ code: "", title: "", description: "", discount_pct: 10, audience: "all", active: true });
    load();
  };

  const toggle = async (p: any) => {
    await supabase.from("promotions").update({ active: !p.active }).eq("id", p.id);
    load();
  };

  return (
    <AdminLayout eyebrow="Campaigns" title="Marketing">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-3">
          {promos.map(p => (
            <div key={p.id} className="p-5 rounded-sm border border-white/5 bg-white/[0.02] flex items-center gap-6">
              <div className="font-mono text-amber-200 text-sm tracking-wider">{p.code}</div>
              <div className="flex-1">
                <div className="font-display text-lg">{p.title}</div>
                <div className="text-xs text-neutral-500 mt-1">{p.description}</div>
              </div>
              <div className="font-display text-3xl text-amber-200">{p.discount_pct}%</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">{p.audience}</div>
              <button onClick={() => toggle(p)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${p.active?"border-emerald-400/40 text-emerald-300":"border-white/10 text-neutral-500"}`}>
                {p.active ? "Active" : "Paused"}
              </button>
            </div>
          ))}
        </div>

        <div className="col-span-4 p-5 rounded-sm border border-white/5 bg-white/[0.02] space-y-3 h-fit">
          <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">New Campaign</div>
          {[["code","Code"],["title","Title"],["description","Description"]].map(([k,l]) => (
            <div key={k}>
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">{l}</label>
              <input value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                className="w-full mt-1 bg-black/40 border border-white/10 px-3 py-2 text-neutral-100 text-sm" />
            </div>
          ))}
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Discount %</label>
            <input type="number" value={form.discount_pct} onChange={e => setForm({ ...form, discount_pct: Number(e.target.value) })}
              className="w-full mt-1 bg-black/40 border border-white/10 px-3 py-2 text-neutral-100 text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Audience</label>
            <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
              className="w-full mt-1 bg-black/40 border border-white/10 px-3 py-2 text-neutral-100 text-sm">
              <option value="all">All guests</option>
              <option value="new">New guests</option>
              <option value="returning">Returning guests</option>
              <option value="vip">VIP / Diamond tier</option>
            </select>
          </div>
          <button onClick={create} className="w-full px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] bg-amber-200 text-black hover:bg-amber-100">Launch</button>
        </div>
      </div>
    </AdminLayout>
  );
}
