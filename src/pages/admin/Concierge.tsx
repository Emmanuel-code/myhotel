import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Sparkles, BookOpen, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

type KnowledgeItem = {
  id: string;
  topic: string;
  answer: string;
};

const DEFAULT_KNOWLEDGE: KnowledgeItem[] = [
  { id: "k-1", topic: "Check-in & Check-out Times", answer: "Check-in is from 14:00 (2:00 PM) and check-out is by 11:00 AM. Early check-in and late check-out can be arranged upon request." },
  { id: "k-2", topic: "Payment Options", answer: "We accept Paystack Online (MTN MoMo, Telecel Cash, Visa/Mastercard) and Pay in Person (Cash GHS, POS terminal, MoMo at reception)." },
  { id: "k-3", topic: "Airport & Regional Transfers", answer: "Chauffeured transfers from Tamale Airport or Bolgatanga are available by reservation with our front desk." },
  { id: "k-4", topic: "Local Navrongo Excursions", answer: "We arrange guided visits to the historic Navrongo Mud Cathedral (Our Lady of Seven Sorrows), Paga Crocodile Pond, and Sirigu women's pottery village." },
  { id: "k-5", topic: "SK Royal Restaurant & Breakfast", answer: "Breakfast is served from 06:30 to 10:30 AM in the main dining hall or delivered to private suites. We serve Sahel & Continental cuisine." },
];

export default function Concierge() {
  const [tab, setTab] = useState<"test" | "knowledge">("knowledge");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Welcome to SK Royal Hotel   Navrongo. How may I assist with your stay, dining, or reservations today?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>(() => {
    const saved = localStorage.getItem("SK_ai_knowledge");
    return saved ? JSON.parse(saved) : DEFAULT_KNOWLEDGE;
  });
  const [newTopic, setNewTopic] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "test") endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const addKnowledge = () => {
    if (!newTopic.trim() || !newAnswer.trim()) return toast.error("Please provide both topic and answer details.");
    const updated = [
      ...knowledgeList,
      { id: "k-" + Date.now(), topic: newTopic.trim(), answer: newAnswer.trim() },
    ];
    setKnowledgeList(updated);
    localStorage.setItem("SK_ai_knowledge", JSON.stringify(updated));
    setNewTopic("");
    setNewAnswer("");
    toast.success("Added to AI Concierge knowledge memory!");
  };

  const deleteKnowledge = (id: string) => {
    const updated = knowledgeList.filter((k) => k.id !== id);
    setKnowledgeList(updated);
    localStorage.setItem("SK_ai_knowledge", JSON.stringify(updated));
    toast.success("Knowledge item removed.");
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: msg }]);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-concierge", {
        body: { message: msg, history: messages.slice(-10), knowledge: knowledgeList },
      });
      if (error || !data?.reply) {
        // Find matching knowledge item
        const match = knowledgeList.find(
          (k) => msg.toLowerCase().includes(k.topic.toLowerCase()) || k.answer.toLowerCase().includes(msg.toLowerCase())
        );
        const reply = match ? match.answer : `Thank you for asking. SK Royal Hotel in Navrongo provides 24/7 guest service. For special requests regarding "${msg}", please contact the front desk at +233 50 123 4567.`;
        setMessages(m => [...m, { role: "assistant", content: reply }]);
      } else {
        setMessages(m => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "I am happy to assist you with reservations, suites, dining, and local excursions at SK Royal Hotel  ." }]);
    } finally { setSending(false); }
  };

  return (
    <AdminLayout eyebrow="Hospitality AI" title="AI Concierge Knowledge & Console">
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setTab("knowledge")}
          className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-colors ${tab === "knowledge" ? "bg-amber-200 text-black font-medium" : "text-neutral-400 hover:text-white bg-white/5"}`}
        >
          <BookOpen className="w-4 h-4" /> AI Knowledge Base ({knowledgeList.length})
        </button>
        <button
          onClick={() => setTab("test")}
          className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest transition-colors ${tab === "test" ? "bg-amber-200 text-black font-medium" : "text-neutral-400 hover:text-white bg-white/5"}`}
        >
          <Sparkles className="w-4 h-4" /> Live Concierge Test
        </button>
      </div>

      {tab === "knowledge" ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Knowledge Form */}
          <div className="lg:col-span-1 p-6 rounded-sm border border-white/5 bg-white/[0.02]">
            <div className="text-[11px] uppercase tracking-[0.3em] text-amber-200 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Teach AI Concierge
            </div>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Add new hotel policies, local attractions, seasonal menus, or promotions. The AI will immediately use this context to respond to guests.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500">Topic / Question Title</label>
                <input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Swimming Pool Hours, Shuttle to Tamale"
                  className="w-full mt-1.5 bg-black/40 border border-white/10 px-3 py-2 text-sm text-neutral-100 focus:border-amber-200"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-neutral-500">Detailed Answer / Hotel Policy</label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={4}
                  placeholder="e.g. Our swimming pool is open daily from 07:00 to 20:00 for resident guests..."
                  className="w-full mt-1.5 bg-black/40 border border-white/10 px-3 py-2 text-sm text-neutral-100 focus:border-amber-200"
                />
              </div>
              <button
                onClick={addKnowledge}
                className="w-full py-3 bg-amber-200 text-black hover:bg-amber-100 font-medium text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Save to AI Memory
              </button>
            </div>
          </div>

          {/* Active Knowledge List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">
              Active Knowledge Items ({knowledgeList.length})
            </div>
            {knowledgeList.map((item) => (
              <div key={item.id} className="p-5 rounded-sm border border-white/5 bg-white/[0.02] flex items-start justify-between gap-4 group">
                <div>
                  <div className="font-display text-base text-amber-200">{item.topic}</div>
                  <p className="text-sm text-neutral-300 mt-1.5 leading-relaxed">{item.answer}</p>
                </div>
                <button
                  onClick={() => deleteKnowledge(item.id)}
                  aria-label="Delete knowledge item"
                  className="p-2 text-neutral-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto rounded-sm border border-white/5 bg-white/[0.02] flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-amber-200 text-black" : "bg-white/5 text-amber-200 border border-amber-200/30"}`}>
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-amber-200/10 text-amber-50" : "bg-white/[0.03] text-neutral-200"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <div className="text-xs text-neutral-500 italic">Concierge is composing…</div>}
            <div ref={endRef} />
          </div>
          <div className="border-t border-white/5 p-4 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about suites, dining, pool hours, policies, excursions…"
              className="flex-1 bg-black/40 border border-white/10 px-4 py-3 text-sm text-neutral-100" />
            <button onClick={send} disabled={sending}
              className="px-5 bg-amber-200 text-black hover:bg-amber-100 disabled:opacity-50 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em]">
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
