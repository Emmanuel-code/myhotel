import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_MODE } from "@/lib/demo";
import { useHotelBrand } from "@/hooks/useHotelBrand";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Check, X } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const { user, loginAsDemo } = useAuth();
  const { brand } = useHotelBrand();

  useEffect(() => {
    if (user) navigate(redirect, { replace: true });
  }, [user, redirect, navigate]);

  const passwordValidation = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = mode === "signin" || (passwordValidation.length && (passwordValidation.hasNumber || passwordValidation.hasSpecial));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !passwordValidation.length) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirect}`,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Your Hotel. Please check your email to verify your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${redirect}`,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto my-auto py-12">
        <div className="text-center mb-8">
          <div className="eyebrow mb-4">{brand.name} · {brand.town}</div>
          <h1 className="font-display text-4xl mb-3">
            {mode === "signin" ? "Guest & Staff Portal" : "Create an Account"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Experience {brand.name}&apos;s premier luxury hospitality. Sign in to manage your reservations,
            dining bookings, invoices, or staff operations.
          </p>
          <div className="hairline mt-10" />
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground text-left max-w-xs mx-auto">
            <li className="flex items-center gap-2"><span>·</span> Manage and modify upcoming stays</li>
            <li className="flex items-center gap-2"><span>·</span> Download invoices and receipts</li>
            <li className="flex items-center gap-2"><span>·</span> Track points toward Diamond status</li>
            <li className="flex items-center gap-2"><span>·</span> Pre-arrival pillow & dietary preferences</li>
          </ul>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="flex gap-1 mb-8 border border-border" role="tablist" aria-label="Authentication modes">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 py-3 text-[11px] uppercase tracking-[0.28em] transition-colors",
                  mode === m ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Role explorer — lets prospects try every user role with one click */}
          {DEMO_MODE && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300 font-semibold mb-2 flex items-center justify-between">
                <span>👋 Explore every role</span>
                <span className="text-[9px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-400">No sign-up needed</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Step into the owner's dashboard, front desk, housekeeping or a guest account — one click, no sign-up:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { loginAsDemo("owner"); navigate("/admin"); }}
                  className="p-2 text-left bg-background border border-border rounded-lg hover:border-amber-400 text-xs transition-colors"
                >
                  <div className="font-medium text-foreground">👑 Hotel Owner / GM</div>
                  <div className="text-[10px] text-muted-foreground">All Admin Portals</div>
                </button>
                <button
                  type="button"
                  onClick={() => { loginAsDemo("front_desk"); navigate("/admin/front-desk"); }}
                  className="p-2 text-left bg-background border border-border rounded-lg hover:border-amber-400 text-xs transition-colors"
                >
                  <div className="font-medium text-foreground">🛎️ Front Desk</div>
                  <div className="text-[10px] text-muted-foreground">Check-in / Keys</div>
                </button>
                <button
                  type="button"
                  onClick={() => { loginAsDemo("housekeeping"); navigate("/admin/housekeeping"); }}
                  className="p-2 text-left bg-background border border-border rounded-lg hover:border-amber-400 text-xs transition-colors"
                >
                  <div className="font-medium text-foreground">🧹 Housekeeping</div>
                  <div className="text-[10px] text-muted-foreground">Room Turnovers</div>
                </button>
                <button
                  type="button"
                  onClick={() => { loginAsDemo("guest"); navigate("/dashboard"); }}
                  className="p-2 text-left bg-background border border-border rounded-lg hover:border-amber-400 text-xs transition-colors"
                >
                  <div className="font-medium text-foreground">👤 VIP Guest</div>
                  <div className="text-[10px] text-muted-foreground">Stays &amp; Invoices</div>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="w-full py-3.5 border border-border hover:border-foreground text-xs uppercase tracking-[0.28em] mb-6 flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-5">
                <Field label="First name" value={firstName} onChange={setFirst} required />
                <Field label="Last name" value={lastName} onChange={setLast} required />
              </div>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary text-sm"
              />
              {mode === "signup" && password.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className={cn("flex items-center gap-1.5 text-[11px]", passwordValidation.length ? "text-emerald-500" : "text-muted-foreground")}>
                    {passwordValidation.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    At least 8 characters
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-[11px]", (passwordValidation.hasNumber || passwordValidation.hasSpecial) ? "text-emerald-500" : "text-muted-foreground")}>
                    {(passwordValidation.hasNumber || passwordValidation.hasSpecial) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    Contains a number or special character
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-gilded w-full mt-4 disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
            {mode === "signin" && (
              <div className="text-center mt-4">
                <Link to="/forgot-password" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground hover:text-foreground">Forgot password?</Link>
              </div>
            )}
          </form>

          <p className="mt-8 text-xs text-muted-foreground text-center">
            By continuing you agree to the <Link to="/" className="underline">Hotel Terms</Link> &amp; privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary text-sm"
      />
    </div>
  );
}
