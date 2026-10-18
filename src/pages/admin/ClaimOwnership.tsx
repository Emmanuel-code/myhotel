import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { DEMO_MODE } from "@/lib/demo";
import { toast } from "sonner";

export default function ClaimOwnership() {
  const { user, loading } = useAuth();
  const { isStaff, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading || rolesLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0d0d10] text-neutral-100">Loading…</div>;
  if (!user) { navigate("/auth?redirect=/admin/claim"); return null; }
  if (isStaff) { navigate("/admin"); return null; }

  const claim = async () => {
    setBusy(true);
    if (DEMO_MODE) {
      // Demo mode: grant ownership locally, no backend needed
      try { localStorage.setItem("SK_demo_claimed", "true"); } catch { /* ignore */ }
      setBusy(false);
      toast.success("Ownership claimed — welcome! You now have full operational access.");
      navigate("/admin");
      return;
    }
    const { data, error } = await supabase.functions.invoke("claim-ownership");
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data?.ok) return toast.error("Ownership has already been claimed. Ask an existing owner to grant you a role.");
    toast.success("Welcome, Maître de Maison.");
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d10] text-neutral-100 p-6">
      <div className="max-w-md text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-amber-200/80 mb-3">Your Hotel   · Operations</div>
        <h1 className="font-display text-4xl mb-4">Claim ownership</h1>
        <p className="text-sm text-neutral-400 leading-relaxed mb-8">
          This estate has not yet been assigned an owner. The first staff member to claim ownership receives every operational role.
          Subsequent staff can then be invited from the Staff & Roles panel.
        </p>
        <button onClick={claim} disabled={busy}
          className="px-8 py-3 text-[11px] uppercase tracking-[0.3em] bg-amber-200 text-black hover:bg-amber-100 disabled:opacity-50">
          {busy ? "Claiming…" : "Claim ownership"}
        </button>
        <div className="mt-6">
          <Link to="/" className="text-xs uppercase tracking-[0.3em] text-neutral-500 hover:text-neutral-300">Back to site</Link>
        </div>
      </div>
    </div>
  );
}
