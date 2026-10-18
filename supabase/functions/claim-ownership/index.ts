// Allows the very first user to claim 'owner' role. No-op once an owner exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });

    // Atomic claim using transaction advisory lock
    const { data: claimed, error: rpcError } = await admin.rpc("claim_initial_ownership", {
      claimant_id: user.id,
    });

    if (rpcError) {
      console.error("claim_initial_ownership RPC error:", rpcError);
      return new Response(JSON.stringify({ error: "Failed to process ownership claim." }), {
        status: 500,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    if (!claimed) {
      return new Response(JSON.stringify({ ok: false, reason: "owner_exists" }), {
        status: 409,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in claim-ownership:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
