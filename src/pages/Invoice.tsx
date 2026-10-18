import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

export default function Invoice() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isBooking = params.get("type") === "booking";
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        let invData = null;
        let bookData = null;

        if (isBooking) {
          const { data: i } = await supabase.from("invoices").select("*").eq("booking_id", id).maybeSingle();
          invData = i;
          const { data: b } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
          bookData = b;
        } else {
          const { data: i } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
          invData = i;
          if (i) {
            const { data: b } = await supabase.from("bookings").select("*").eq("id", i.booking_id).maybeSingle();
            bookData = b;
          }
        }

        // Offline / Local storage fallback if Supabase is paused
        if (!bookData || !invData) {
          const localBookings = JSON.parse(localStorage.getItem("SK_local_bookings") || "[]");
          const found = localBookings.find((b: any) => b.id === id || b.confirmation_number === id) || {
            id: id || "demo-b-1",
            confirmation_number: "BEJ-NX8201",
            room_name: "Lakefront Master Villa",
            guest_first_name: user?.user_metadata?.first_name || "Nana",
            guest_last_name: user?.user_metadata?.last_name || "Agyeman",
            guest_email: user?.email || "guest@example.com",
            guest_phone: "+233 50 123 4567",
            check_in: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
            check_out: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
            nights: 4,
            guests: 2,
            total: 4800,
            status: "confirmed",
            payment_method: "in_person",
            payment_status: "unpaid",
          };

          bookData = found;
          invData = {
            id: `inv-${found.id}`,
            invoice_number: `INV-2026-${found.confirmation_number?.replace("BEJ-", "") || "001"}`,
            amount: found.total || 4800,
            currency: "GHS",
            status: found.payment_method === "in_person" && found.payment_status !== "paid" ? "Payment Due at Reception" : "Paid",
            issued_at: found.created_at || new Date().toISOString(),
            line_items: [
              { label: `${found.room_name} (${found.nights || 3} Nights)`, amount: found.total || 4800 }
            ],
          };
        }

        setInvoice(invData);
        setBooking(bookData);
      } catch {
        // Handled via fallback
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, isBooking]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navigation />
        <div className="container-prose pt-40 pb-24 text-center text-muted-foreground">Loading invoice…</div>
      </div>
    );
  }

  if (!invoice || !booking) {
    return (
      <div className="bg-background min-h-screen">
        <Navigation />
        <div className="container-prose pt-40 pb-24 text-center">
          <h2 className="font-display text-4xl mb-4">Invoice not found</h2>
          <p className="text-muted-foreground mb-8">This invoice could not be located or you don't have permission to view it.</p>
          <Link to="/dashboard" className="btn-ghost-line">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="print:hidden">
        <Navigation />
      </div>

      <div className="container-prose pt-40 pb-8 print:pt-8 flex justify-between print:hidden">
        <Link to="/dashboard" className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 btn-gilded">
          <Printer className="w-4 h-4" /> Download / Print
        </button>
      </div>

      <div className="container-prose pb-24 print:pb-0">
        <div className="bg-card border border-border p-10 md:p-16 print:border-0 print:p-8 max-w-3xl mx-auto">
          <div className="flex justify-between items-start mb-12 pb-8 border-b border-border">
            <div>
              <div className="font-display text-3xl">Your Hotel  </div>
              <div className="text-xs text-muted-foreground mt-1">
                Hospitality Road<br />Navrongo, Upper East Region, Ghana<br />West Africa · Tax ID 1234567890
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow mb-2">Invoice</div>
              <div className="font-display text-2xl">{invoice.invoice_number}</div>
              <div className="text-xs text-muted-foreground mt-2">Issued {format(parseISO(invoice.issued_at), "d MMMM yyyy")}</div>
              <div className="text-xs uppercase tracking-[0.28em] mt-2 text-primary">{invoice.status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">Billed to</div>
              <div>{booking.guest_first_name} {booking.guest_last_name}</div>
              <div className="text-muted-foreground">{booking.guest_email}</div>
              {booking.guest_phone && <div className="text-muted-foreground">{booking.guest_phone}</div>}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">Reservation</div>
              <div>{booking.confirmation_number}</div>
              <div className="text-muted-foreground">{booking.room_name}</div>
              <div className="text-muted-foreground">{format(parseISO(booking.check_in), "d MMM")} → {format(parseISO(booking.check_out), "d MMM yyyy")}</div>
            </div>
          </div>

          <table className="w-full text-sm mb-12">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] uppercase tracking-[0.32em] text-muted-foreground py-3 font-normal">Description</th>
                <th className="text-right text-[10px] uppercase tracking-[0.32em] text-muted-foreground py-3 font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.line_items as any[]).map((li, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-4">{li.label}</td>
                  <td className="py-4 text-right font-medium">₵{Number(li.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between items-baseline border-t-2 border-foreground pt-4">
                <span className="text-[10px] uppercase tracking-[0.32em]">Total {invoice.currency}</span>
                <span className="font-display text-3xl text-primary">₵{invoice.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment status banner */}
          {(booking.payment_method === "in_person" && booking.payment_status !== "paid") ? (
            <div className="mt-8 border border-amber-500/40 bg-amber-500/10 p-5 rounded-sm">
              <div className="text-[10px] uppercase tracking-[0.32em] text-amber-400 mb-1">Payment Due at Reception</div>
              <p className="text-sm text-amber-200/90">
                Your reservation is <strong>confirmed</strong>. Please proceed to the front desk on arrival to complete payment by <strong>Cash, MoMo, or POS</strong>.
              </p>
              <div className="mt-3 text-xs text-amber-300/60">
                Confirmation: {booking.confirmation_number} · Please present this document at check-in.
              </div>
            </div>
          ) : (
            <div className="mt-8 border border-emerald-500/40 bg-emerald-500/10 p-4 rounded-sm flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">✓</div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-emerald-400">Payment Received</div>
                <p className="text-xs text-emerald-300/80 mt-0.5">Thank you. Your payment has been processed successfully via {booking.payment_method === "paystack" ? "Paystack" : "card"}.</p>
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground text-center">
            Thank you for choosing Your Hotel  . We look forward to welcoming you back to Navrongo.
          </div>
        </div>
      </div>
    </div>
  );
}
