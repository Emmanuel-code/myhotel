import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Password reset link sent.");
    } catch (err: any) {
      toast.error(err.message || "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />
      <section className="container-prose pt-40 pb-24 grid lg:grid-cols-2 gap-16 items-start">
        <div className="hidden lg:block sticky top-32">
          <div className="eyebrow mb-4">Your Hotel   · Navrongo</div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mt-auto">
            Recover your access.
          </h1>
          <p className="text-muted-foreground leading-relaxed text-sm mt-8 max-w-sm">
            Enter your email address and we will send you a secure link to reset your password.
          </p>
        </div>

        <div className="max-w-md w-full mx-auto lg:mx-0 lg:ml-auto">
          {done ? (
            <div className="text-center py-10 border border-border p-8">
              <h2 className="font-display text-3xl mb-4">Check your inbox</h2>
              <p className="text-muted-foreground text-sm mb-8">We have sent a reset link to {email}.</p>
              <Link to="/auth" className="btn-ghost-line">Return to Sign in</Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl mb-8">Forgot password</h2>
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
                  />
                </div>
                <button type="submit" disabled={busy} className="btn-gilded w-full mt-2 disabled:opacity-50">
                  {busy ? "Please wait…" : "Send reset link"}
                </button>
              </form>
              <p className="mt-8 text-xs text-muted-foreground text-center">
                Remembered your password? <Link to="/auth" className="underline">Sign in</Link>.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
