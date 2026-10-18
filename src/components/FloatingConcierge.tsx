import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; time: string };

const QUICK_QUESTIONS = [
  "What suites or villas are available?",
  "Tell me about the dining and cuisine",
  "How does Pay in Person or Paystack work?",
  "What local attractions are near Navrongo?"
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FloatingConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hello and welcome to Your Hotel Navrongo! I am your 24/7 AI Concierge. How may I assist you with reservations, dining, amenities, or local experiences today?",
      time: now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus management: move focus into modal on open, back to trigger on close
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const send = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    setInput("");
    const userMsg: Msg = { role: "user", content: text, time: now() };
    const newHistory: Msg[] = [...messages, userMsg];
    setMessages(newHistory);
    setSending(true);

    // Abort after 20 seconds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const { data, error } = await supabase.functions.invoke("ai-concierge", {
        body: { message: text, history: newHistory.slice(-10).map(({ role, content }) => ({ role, content })) },
      });

      clearTimeout(timeout);

      if (error || !data?.reply) {
        // Contextual offline fallback
        const lower = text.toLowerCase();
        let fallback = "Thank you for asking! Your Hotel in Navrongo, Ghana offers Executive Suites and Villas, gourmet Sahelian & Continental cuisine, full spa rituals, and flexible payment (Paystack & Pay in Person). Our front desk is available 24/7 at +233 (0) 50 123 4567.";
        if (lower.includes("suite") || lower.includes("room") || lower.includes("price") || lower.includes("villa"))
          fallback = "We offer Executive Suites, Deluxe Rooms, Lake Suites, and Garden Villas from ₵850/night. Explore full photos and amenities on our Suites & Villas page, or reserve online anytime!";
        else if (lower.includes("dining") || lower.includes("food") || lower.includes("restaurant") || lower.includes("breakfast"))
          fallback = "The Your Restaurant & Lounge serves authentic Northern Ghanaian specialties alongside Continental gastronomy and curated wines. Breakfast can be delivered directly to your terrace.";
        else if (lower.includes("pay") || lower.includes("momo") || lower.includes("paystack"))
          fallback = "You can pay securely online with Paystack (MTN Mobile Money, Telecel Cash, Visa/Mastercard) or choose 'Pay in Person' — Cash, MoMo, or POS upon arrival at our front desk.";
        else if (lower.includes("attraction") || lower.includes("navrongo") || lower.includes("cathedral") || lower.includes("paga"))
          fallback = "Your Hotel is minutes from the Navrongo Mud Cathedral, CKT-UTAS, Paga Crocodile Sanctuary, and Sirigu Pottery & Art village. Our concierge organises guided regional excursions.";

        setMessages(m => [...m, { role: "assistant", content: fallback, time: now() }]);
      } else {
        setMessages(m => [...m, { role: "assistant", content: data.reply, time: now() }]);
      }
    } catch (e: any) {
      clearTimeout(timeout);
      const isTimeout = e?.name === "AbortError";
      setMessages(m => [...m, {
        role: "assistant",
        content: isTimeout
          ? "I apologise — my response timed out. Please try again or reach us directly at +233 (0) 50 123 4567."
          : "I apologise for the inconvenience. Please try again or call our front desk at +233 (0) 50 123 4567.",
        time: now(),
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
          <button
            ref={triggerRef}
            onClick={() => setOpen(true)}
            aria-label="Open AI Concierge Chat"
            aria-expanded={false}
            aria-haspopup="dialog"
            className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#120F0C] text-amber-200 border border-amber-500/30 shadow-[0_12px_40px_rgba(186,140,59,0.25)] hover:shadow-[0_16px_50px_rgba(186,140,59,0.45)] hover:border-amber-400/60 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md"
          >
            {/* Decorative pulse — hidden from AT */}
            <span className="absolute inset-0 rounded-full bg-amber-400/15 animate-ping duration-1000 -z-10" aria-hidden="true" />
            <div className="relative" aria-hidden="true">
              <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.24em] font-medium text-amber-100 group-hover:text-white transition-colors">
              24/7 AI
            </span>
          </button>
        )}
      </div>

      {/* Chat dialog */}
      {open && (
        <>
          {/* Click-outside backdrop */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Your Hotel AI Concierge"
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] bg-background border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            {/* Header */}
            <div className="bg-foreground text-background p-4 flex items-center justify-between border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40" aria-hidden="true">
                  <Bot className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="font-display text-base text-primary-glow leading-tight">Your AI Concierge</div>
                  <div className="text-[10px] text-background/60 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    Always Online · Navrongo
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI Concierge chat"
                className="p-1.5 text-background/60 hover:text-background rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30"
              aria-live="polite"
              aria-atomic="false"
              aria-label="Chat messages"
            >
              {messages.map((m, idx) => (
                <div key={idx} className={cn("flex gap-2.5 items-end", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"
                    )}
                    aria-hidden="true"
                  >
                    {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <div className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card text-foreground border border-border/70 rounded-bl-none shadow-sm"
                    )}>
                      {m.content}
                    </div>
                    <span className="text-[9px] text-muted-foreground px-1" aria-label={`Sent at ${m.time}`}>{m.time}</span>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex gap-2 items-center text-xs text-muted-foreground bg-card/60 p-2.5 rounded-xl w-fit border border-border/50" aria-live="polite">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" aria-hidden="true" />
                  <span>Concierge is composing advice…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="p-3 bg-card border-t border-border/50 flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-[11px] text-left px-2.5 py-1 rounded-full bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-card border-t border-border flex items-center gap-2">
              <label htmlFor="concierge-input" className="sr-only">Message the AI concierge</label>
              <input
                id="concierge-input"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask about rooms, payments, dining, events…"
                maxLength={1000}
                className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <button
                onClick={() => send()}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="bg-primary text-primary-foreground p-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
