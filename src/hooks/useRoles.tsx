import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, DemoRole } from "@/hooks/useAuth";

export type AppRole = "owner" | "gm" | "front_desk" | "housekeeping" | "restaurant" | "spa" | "marketing";

export function useRoles() {
  const { user, demoUser, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    // If logged in via Demo Account (permitted whenever DEMO_MODE is true, incl. production demo builds)
    if (import.meta.env.VITE_DEMO_MODE === "true" && demoUser) {
      if (demoUser.role === "owner") {
        setRoles(["owner", "gm", "front_desk", "housekeeping", "restaurant", "spa", "marketing"]);
      } else if (demoUser.role === "gm") {
        setRoles(["gm", "front_desk", "housekeeping", "restaurant", "spa", "marketing"]);
      } else if (demoUser.role === "guest") {
        setRoles([]);
      } else {
        setRoles([demoUser.role as AppRole]);
      }
      setLoading(false);
      return;
    }

    // Otherwise load from Supabase
    (async () => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        setRoles((data ?? []).map((r: any) => r.role as AppRole));
      } catch {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, demoUser, authLoading]);

  const has = (r: AppRole) => roles.includes(r);
  const hasAny = (...rs: AppRole[]) => rs.some((r) => roles.includes(r));
  const isStaff = roles.length > 0;

  return { roles, loading, has, hasAny, isStaff };
}
