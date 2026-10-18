import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { TrendingUp, BedDouble, Euro, Star, Users } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { useRoles } from "@/hooks/useRoles";

type Stat = { label: string; value: string; sub?: string; icon: any; isFinancial?: boolean };

export default function AdminDashboard() {
  const { hasAny } = useRoles();
  const isExecutive = hasAny("owner", "gm");
  const [stats, setStats] = useState<Stat[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: bookings }, { data: units }, { count: guestCount }] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("room_units").select("*"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const total = (bookings ?? []).reduce((s: number, b: any) => s + (b.total ?? 0), 0);
      const occ = (units ?? []).filter((u: any) => u.status === "occupied").length;
      const totalUnits = (units ?? []).length || 1;
      const adr = bookings && bookings.length ? Math.round(total / bookings.reduce((s: number, b: any) => s + b.nights, 0 || 1)) : 0;
      const revpar = Math.round((total / 30) / totalUnits);

      setStats([
        { label: "Total Revenue", value: isExecutive ? `₵${total.toLocaleString()}` : "₵ ••••••", sub: isExecutive ? "Lifetime" : "Owner / GM Access", icon: Euro, isFinancial: true },
        { label: "Occupancy", value: `${Math.round((occ / totalUnits) * 100)}%`, sub: `${occ}/${totalUnits} keys`, icon: BedDouble },
        { label: "ADR", value: isExecutive ? `₵${adr.toLocaleString()}` : "₵ •••", sub: isExecutive ? "Average daily rate" : "Owner / GM Access", icon: TrendingUp, isFinancial: true },
        { label: "RevPAR", value: isExecutive ? `₵${revpar.toLocaleString()}` : "₵ •••", sub: isExecutive ? "30-day estimate" : "Owner / GM Access", icon: Star, isFinancial: true },
        { label: "Active Guests", value: String(guestCount ?? 0), sub: "Registered profiles", icon: Users },
      ]);

      // Revenue last 8 weeks
      const weeks: Record<string, number> = {};
      (bookings ?? []).forEach((b: any) => {
        const d = new Date(b.created_at);
        const wk = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString("en", { month: "short" })}`;
        weeks[wk] = (weeks[wk] ?? 0) + (b.total ?? 0);
      });
      setRevenue(Object.entries(weeks).slice(-8).map(([name, value]) => ({ name, value })));

      // Occupancy by room type
      const byType: Record<string, { occupied: number; total: number }> = {};
      (units ?? []).forEach((u: any) => {
        byType[u.room_name] ??= { occupied: 0, total: 0 };
        byType[u.room_name].total += 1;
        if (u.status === "occupied") byType[u.room_name].occupied += 1;
      });
      setOccupancy(Object.entries(byType).map(([name, v]) => ({ name: name.split(" ")[0], occupied: v.occupied, available: v.total - v.occupied })));

      setRecent((bookings ?? []).slice(0, 6));
    })();
  }, []);

  return (
    <AdminLayout eyebrow="Operations" title="Executive Overview">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-sm border border-white/5 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">{s.label}</span>
              <s.icon className="w-3.5 h-3.5 text-amber-200/80" />
            </div>
            <div className="font-display text-3xl mt-3">{s.value}</div>
            {s.sub && <div className="text-xs text-neutral-500 mt-1">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-sm border border-white/5 bg-white/[0.02] p-6">
          <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">Revenue Trend</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={revenue}>
                <CartesianGrid stroke="#ffffff08" />
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #ffffff10", color: "#fff" }} />
                <Line type="monotone" dataKey="value" stroke="#d4b878" strokeWidth={2} dot={{ fill: "#d4b878" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-sm border border-white/5 bg-white/[0.02] p-6">
          <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">Occupancy by Category</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={occupancy}>
                <CartesianGrid stroke="#ffffff08" />
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #ffffff10", color: "#fff" }} />
                <Bar dataKey="occupied" stackId="a" fill="#d4b878" />
                <Bar dataKey="available" stackId="a" fill="#ffffff20" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-white/5 bg-white/[0.02] p-6">
        <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">Recent Reservations</div>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 border-b border-white/5">
            <tr>{["Conf #", "Guest", "Room", "Check-in", "Nights", "Total", "Status"].map(h => <th key={h} className="text-left py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {recent.map((b) => (
              <tr key={b.id} className="border-b border-white/5">
                <td className="py-3 text-amber-200/80 font-mono text-xs">{b.confirmation_number}</td>
                <td>{b.guest_first_name} {b.guest_last_name}</td>
                <td className="text-neutral-400">{b.room_name}</td>
                <td className="text-neutral-400">{b.check_in}</td>
                <td className="text-neutral-400">{b.nights}</td>
                <td>₵{b.total?.toLocaleString()}</td>
                <td><span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-amber-200/10 text-amber-200">{b.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-neutral-500">No reservations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
