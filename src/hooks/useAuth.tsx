import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/lib/demo";

export type DemoRole = "guest" | "owner" | "gm" | "front_desk" | "housekeeping" | "restaurant" | "spa" | "marketing";

export type DemoAccount = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: DemoRole;
};

export const DEMO_ACCOUNTS: Record<DemoRole, DemoAccount> = {
  owner: {
    id: "demo-owner-001",
    email: "owner@yourhotel.com",
    first_name: "Kwame",
    last_name: "Ansah",
    role: "owner",
  },
  gm: {
    id: "demo-gm-002",
    email: "gm@yourhotel.com",
    first_name: "Ama",
    last_name: "Owusu",
    role: "gm",
  },
  front_desk: {
    id: "demo-frontdesk-003",
    email: "frontdesk@yourhotel.com",
    first_name: "Kofi",
    last_name: "Mensah",
    role: "front_desk",
  },
  housekeeping: {
    id: "demo-housekeeping-004",
    email: "housekeeping@yourhotel.com",
    first_name: "Akosua",
    last_name: "Addae",
    role: "housekeeping",
  },
  restaurant: {
    id: "demo-restaurant-005",
    email: "restaurant@yourhotel.com",
    first_name: "Selasi",
    last_name: "Mensah",
    role: "restaurant",
  },
  spa: {
    id: "demo-spa-006",
    email: "spa@yourhotel.com",
    first_name: "Esi",
    last_name: "Baidoo",
    role: "spa",
  },
  marketing: {
    id: "demo-marketing-007",
    email: "marketing@yourhotel.com",
    first_name: "Yaw",
    last_name: "Boateng",
    role: "marketing",
  },
  guest: {
    id: "demo-guest-008",
    email: "guest@example.com",
    first_name: "Nana",
    last_name: "Agyeman",
    role: "guest",
  },
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  demoUser: DemoAccount | null;
  loginAsDemo: (role: DemoRole) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  demoUser: null,
  loginAsDemo: () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [demoUser, setDemoUser] = useState<DemoAccount | null>(() => {
    if (!DEMO_MODE) {
      try { localStorage.removeItem("SK_demo_user"); } catch { }
      return null;
    }
    try {
      const saved = localStorage.getItem("SK_demo_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE && demoUser) {
      setUser({
        id: demoUser.id,
        email: demoUser.email,
        app_metadata: {},
        user_metadata: { first_name: demoUser.first_name, last_name: demoUser.last_name },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [demoUser]);

  const loginAsDemo = (role: DemoRole) => {
    if (!DEMO_MODE) {
      console.warn("Demo mode is disabled. Set VITE_DEMO_MODE=true to enable demo accounts.");
      return;
    }
    const acc = DEMO_ACCOUNTS[role];
    setDemoUser(acc);
    localStorage.setItem("SK_demo_user", JSON.stringify(acc));
    setUser({
      id: acc.id,
      email: acc.email,
      app_metadata: {},
      user_metadata: { first_name: acc.first_name, last_name: acc.last_name },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User);
  };

  const signOut = async () => {
    localStorage.removeItem("SK_demo_user");
    try { localStorage.removeItem("SK_demo_claimed"); } catch { /* ignore */ }
    setDemoUser(null);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore network errors if supabase is paused
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        demoUser,
        loginAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
