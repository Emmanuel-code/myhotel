import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, Trash2, Key } from "lucide-react";

const ROLES = ["owner", "gm", "front_desk", "housekeeping", "restaurant", "spa", "marketing"];

export default function Staff() {
  const [rows, setRows] = useState<any[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("front_desk");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const { data: roles } = await supabase.from("user_roles").select("*").order("created_at");
      const ids = [...new Set((roles ?? []).map((r: any) => r.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, email, first_name, last_name").in("id", ids);
        const byId: any = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
        setRows((roles ?? []).map((r: any) => ({ ...r, profile: byId[r.user_id] })));
      } else {
        setRows([
          { id: "r-1", user_id: "demo-owner-001", role: "owner", profile: { first_name: "Kwame", last_name: "SK", email: "owner@SKhotel.com" } },
          { id: "r-2", user_id: "demo-gm-002", role: "gm", profile: { first_name: "Ama", last_name: "Owusu", email: "gm@SKhotel.com" } },
          { id: "r-3", user_id: "demo-frontdesk-003", role: "front_desk", profile: { first_name: "Kofi", last_name: "Mensah", email: "frontdesk@SKhotel.com" } },
          { id: "r-4", user_id: "demo-housekeeping-004", role: "housekeeping", profile: { first_name: "Akosua", last_name: "Addae", email: "housekeeping@SKhotel.com" } },
        ]);
      }
    } catch {
      // Offline fallback
    }
  };
  useEffect(() => { load(); }, []);

  const createStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName) return toast.error("Please provide email and staff member name.");
    
    // Generate secure random temp password if not provided
    const secureTempPassword = password.trim() || (() => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
      const randomValues = new Uint32Array(12);
      crypto.getRandomValues(randomValues);
      return Array.from(randomValues, (v) => chars[v % chars.length]).join("");
    })();

    setCreating(true);

    try {
      // 1. Use ephemeral client with persistSession: false so the admin's session is never overwritten
      const ephemeralClient = (await import("@supabase/supabase-js")).createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: authData, error: authErr } = await ephemeralClient.auth.signUp({
        email: email.trim().toLowerCase(),
        password: secureTempPassword,
        options: {
          data: { first_name: firstName.trim(), last_name: lastName.trim() },
        },
      });

      if (authErr) throw authErr;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("Could not create user account.");

      // 2. Insert into user_roles with the primary admin client
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role as any,
      });

      if (roleErr) throw roleErr;

      // 3. Update local state immediately
      setRows((prev) => [
        ...prev,
        {
          id: `role-${Date.now()}`,
          user_id: userId,
          role,
          profile: { first_name: firstName, last_name: lastName, email },
        },
      ]);

      toast.success(`Staff account created for ${firstName} (${role.replace("_", " ")}). Temp password: ${secureTempPassword}`);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff account.");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    await supabase.from("user_roles").delete().eq("id", id);
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Role revoked.");
  };

  // group by user
  const grouped: Record<string, { profile: any; roles: any[] }> = {};
  rows.forEach((r) => {
    grouped[r.user_id] ??= { profile: r.profile, roles: [] };
    grouped[r.user_id].roles.push(r);
  });

  return (
    <AdminLayout eyebrow="Team & Access" title="Staff Management">
      {/* Create / Onboard New Staff Direct Form */}
      <div className="rounded-sm border border-white/5 bg-white/[0.02] p-6 mb-8">
        <div className="text-[11px] uppercase tracking-[0.3em] text-amber-200 mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Create New Staff Account
        </div>
        <p className="text-xs text-neutral-400 mb-6">
          As an owner/manager, you can create credentials directly for your hotel employees. Staff can log in immediately and change their password later.
        </p>

        <form onSubmit={createStaffAccount} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Kwame"
              required
              className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm focus:border-amber-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Mensah"
              className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm focus:border-amber-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Staff Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@SKhotel.com"
              required
              className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm focus:border-amber-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Initial Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Default: SKStaff2026!"
              className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm focus:border-amber-200"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-neutral-500">Hotel Department / Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1.5 bg-black/40 border border-white/10 text-neutral-100 px-3 py-2 text-sm focus:border-amber-200"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5 flex justify-end mt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] bg-amber-200 text-black hover:bg-amber-100 font-medium transition-colors disabled:opacity-50"
            >
              {creating ? "Creating Account…" : "Create & Authorize Staff"}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([uid, g]) => (
          <div key={uid} className="p-5 rounded-sm border border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="flex-1">
              <div className="font-display text-lg">{g.profile?.first_name} {g.profile?.last_name || "—"}</div>
              <div className="text-xs text-neutral-500">{g.profile?.email}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.roles.map((r: any) => (
                <span key={r.id} className="inline-flex items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-amber-200/10 text-amber-200 border border-amber-200/30">
                  {r.role.replace("_", " ")}
                  <button onClick={() => remove(r.id)} className="text-amber-200/60 hover:text-rose-300">×</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
