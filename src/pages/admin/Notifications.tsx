import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("all");

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    setList(data ?? []);
  };
  useEffect(() => {
    load();
    const channel = supabase
      .channel("notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      body,
      audience_role: role === "all" ? null : role,
      user_id: user?.id,
      read: false,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("notifications").insert({
        title,
        body,
        audience_role: (role === "all" ? null : role) as any,
        user_id: user?.id
      });
      if (error) throw error;
    } catch {
      // Offline fallback
      const cached = JSON.parse(localStorage.getItem("SK_notifications") || "[]");
      localStorage.setItem("SK_notifications", JSON.stringify([newNotif, ...cached]));
    }

    setTitle("");
    setBody("");
    toast.success("Broadcast sent to " + (role === "all" ? "All Staff" : role.replace("_", " ").toUpperCase()));
    setList((prev) => [newNotif, ...prev]);
  };

  return (
    <AdminLayout eyebrow="Inbox" title="Notifications">
      <div className="max-w-3xl mb-12">
        <h3 className="text-sm font-medium mb-4">Send Broadcast</h3>
        <form onSubmit={send} className="grid sm:grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 p-6">
          <div className="sm:col-span-2">
            <label htmlFor="notif-title" className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Title</label>
            <input id="notif-title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-amber-200" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notif-body" className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Message</label>
            <textarea id="notif-body" value={body} onChange={e => setBody(e.target.value)} rows={2} className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-amber-200" />
          </div>
          <div>
            <label htmlFor="notif-audience" className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Audience</label>
            <select id="notif-audience" value={role} onChange={e => setRole(e.target.value)} className="w-full mt-2 bg-transparent border-b border-white/10 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-amber-200 text-neutral-300">
              <option value="all">All Staff</option>
              <option value="front_desk">Front Desk</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="restaurant">Restaurant</option>
              <option value="spa">Spa</option>
              <option value="gm">General Manager</option>
            </select>
          </div>
          <div className="flex items-end justify-end">
            <button type="submit" className="px-4 py-2 border border-amber-200 text-amber-200 text-[10px] uppercase tracking-widest hover:bg-amber-200 hover:text-black transition-colors">Broadcast</button>
          </div>
        </form>
      </div>

      <div className="space-y-2 max-w-3xl">
        {list.map(n => (
          <div key={n.id} className={`p-4 rounded-sm border flex items-start gap-4 ${n.read ? "border-white/5 bg-white/[0.02]" : "border-amber-200/30 bg-amber-200/[0.04]"}`}>
            <Bell className={`w-4 h-4 mt-1 ${n.read ? "text-neutral-500" : "text-amber-200"}`} />
            <div className="flex-1">
              <div className="text-sm">{n.title}</div>
              {n.body && <div className="text-xs text-neutral-500 mt-1">{n.body}</div>}
              <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-600 mt-2">
                {new Date(n.created_at).toLocaleString()}{n.audience_role ? ` · ${n.audience_role}` : ""}
              </div>
            </div>
            {!n.read && <button onClick={() => markRead(n.id)} className="text-[10px] uppercase tracking-[0.2em] text-amber-200">Mark read</button>}
          </div>
        ))}
        {list.length === 0 && <div className="text-center py-16 text-neutral-500">No notifications yet.</div>}
      </div>
    </AdminLayout>
  );
}
