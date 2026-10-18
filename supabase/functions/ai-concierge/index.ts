// AI concierge powered by Lovable AI Gateway (Gemini Flash by default).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the SK Royal Hotel concierge — a premier luxury hotel in Navrongo, Upper East Region, Ghana.
You assist guests with room bookings, dining at SK RoyalRestaurant, conference reservations, and excursions around Navrongo (such as the Navrongo Mud Cathedral, Paga Crocodile Sanctuary, Sirigu pottery village, and CKT-UTAS campus).
Tone: Warm, hospitable, sophisticated, and helpful.`;

interface ValidatedMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized access. Authentication required." }), {
        status: 401,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    if (!sbUrl || !sbKey) {
      return new Response(JSON.stringify({ error: "Service configuration error." }), {
        status: 500,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const sb = createClient(sbUrl, sbKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid authentication credentials." }), {
        status: 401,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
        status: 400,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const rawMessage = typeof body.message === "string" ? body.message.trim() : "";
    if (!rawMessage || rawMessage.length > 1000) {
      return new Response(JSON.stringify({ error: "Message must be between 1 and 1000 characters." }), {
        status: 400,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    // Sanitize history: enforce maximum 10 items, allow only 'user' or 'assistant' roles, cap content length
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const sanitizedHistory: ValidatedMessage[] = rawHistory
      .slice(-10)
      .filter((h: any) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
      .map((h: any) => ({
        role: h.role as "user" | "assistant",
        content: String(h.content).slice(0, 1000),
      }));

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI Concierge is currently unavailable." }), {
        status: 503,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...sanitizedHistory,
      { role: "user", content: rawMessage },
    ];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, stream: false }),
    });

    if (!r.ok) {
      return new Response(JSON.stringify({ error: "Downstream AI service error." }), {
        status: 502,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const data = await r.json();
    const reply = typeof data?.choices?.[0]?.message?.content === "string"
      ? data.choices[0].message.content
      : "";

    // Persist to concierge_messages for the calling user
    try {
      await sb.from("concierge_messages").insert([
        { user_id: user.id, role: "user", content: rawMessage },
        { user_id: user.id, role: "assistant", content: reply },
      ]);
    } catch (dbErr) {
      console.warn("Failed to persist concierge message:", dbErr);
    }

    return new Response(JSON.stringify({ reply }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (e) {
    console.error("AI Concierge unhandled error:", e);
    return new Response(JSON.stringify({ error: "Internal processing error." }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
