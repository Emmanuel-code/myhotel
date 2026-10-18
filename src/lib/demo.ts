/**
 * ─────────────────────────────────────────────────────────────────
 * SK Royal Hotel   — Demo Mode Configuration
 * ─────────────────────────────────────────────────────────────────
 *
 * Controlled by VITE_DEMO_MODE in your .env file:
 *
 *   VITE_DEMO_MODE="true"   → Demo mode ON  (Supabase is paused / testing)
 *   VITE_DEMO_MODE="false"  → Demo mode OFF (Supabase is live — real data only)
 *
 * When you flip to "false" and restart the dev server:
 *   ✓ Demo login buttons disappear from /auth
 *   ✓ All mock / fallback data is replaced by live Supabase queries
 *   ✓ Local storage offline fallbacks are disabled
 *   ✓ Supabase fetch errors surface normally to the user
 * ─────────────────────────────────────────────────────────────────
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// ─── Mock Guest Bookings (used in Dashboard + Invoice) ────────────
export const DEMO_BOOKINGS = DEMO_MODE
  ? [
    {
      id: "demo-b-1",
      confirmation_number: "BEJ-NX8201",
      room_name: "Lakefront Master Villa",
      room_category: "Villa",
      room_view: "Savannah Lake",
      room_image: "/src/assets/hero-villa.jpg",
      check_in: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      check_out: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      guests: 2,
      nights: 4,
      total: 4800,
      status: "confirmed",
      payment_method: "paystack",
      payment_status: "paid",
      created_at: new Date().toISOString(),
    },
  ]
  : [];

// ─── Mock Invoices (used in Dashboard) ───────────────────────────
export const DEMO_INVOICES = DEMO_MODE
  ? [
    {
      id: "demo-inv-1",
      invoice_number: "INV-2026-0042",
      amount: 4800,
      currency: "GHS",
      status: "paid",
      issued_at: new Date().toISOString(),
      payment_method: "paystack",
    },
  ]
  : [];

// ─── Mock Guest Profile ───────────────────────────────────────────
export const DEMO_PROFILE = DEMO_MODE
  ? {
    first_name: "Nana",
    last_name: "Agyeman",
    email: "guest@example.com",
    phone: "+233 50 123 4567",
    loyalty_points: 1250,
    loyalty_tier: "Platinum",
  }
  : null;

// ─── Mock Front Desk Bookings ─────────────────────────────────────
export const DEMO_FRONT_DESK_BOOKINGS = DEMO_MODE
  ? [
    {
      id: "demo-b-101",
      confirmation_number: "BEJ-A19F4",
      guest_first_name: "Nana",
      guest_last_name: "Agyeman",
      guest_email: "guest@example.com",
      guest_phone: "+233 50 123 4567",
      room_name: "Lakefront Master Villa",
      check_in: new Date().toISOString().slice(0, 10),
      check_out: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      nights: 3,
      guests: 2,
      total: 3600,
      status: "confirmed",
      payment_method: "paystack",
      payment_status: "paid",
      room_unit_id: "u-101",
    },
    {
      id: "demo-b-102",
      confirmation_number: "BEJ-C48B2",
      guest_first_name: "Dr. Kwesi",
      guest_last_name: "Annan",
      guest_email: "annan@cktutas.edu.gh",
      guest_phone: "+233 24 555 8989",
      room_name: "Executive Horizon Penthouse",
      check_in: new Date().toISOString().slice(0, 10),
      check_out: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      nights: 2,
      guests: 1,
      total: 3800,
      status: "checked_in",
      payment_method: "in_person",
      payment_status: "unpaid",
      room_unit_id: "u-201",
    },
  ]
  : [];

// ─── Mock Room Units (used in Front Desk + Housekeeping) ──────────
export const DEMO_ROOM_UNITS = DEMO_MODE
  ? [
    { id: "u-101", unit_number: "101", room_name: "Lakefront Master Villa", status: "clean", floor: 1 },
    { id: "u-102", unit_number: "102", room_name: "Savannah Garden Villa", status: "dirty", floor: 1 },
    { id: "u-201", unit_number: "201", room_name: "Executive Horizon Penthouse", status: "occupied", floor: 2 },
    { id: "u-202", unit_number: "202", room_name: "Deluxe Courtyard Room", status: "inspected", floor: 2 },
  ]
  : [];

// ─── Mock Admin KPI Stats (used in AdminDashboard) ────────────────
export const DEMO_ADMIN_STATS = DEMO_MODE
  ? {
    totalRevenue: 248600,
    occupancyRate: 78,
    activeGuests: 14,
    pendingCheckouts: 3,
    adr: 1250,
    revpar: 975,
  }
  : null;

// ─── Offline Fallback Helpers ─────────────────────────────────────
/**
 * Saves a record locally when Supabase is offline/paused.
 * In live mode (DEMO_MODE=false) this is a no-op — data MUST go to Supabase.
 */
export function saveLocalFallback(key: string, record: object) {
  if (!DEMO_MODE) return;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  localStorage.setItem(key, JSON.stringify([{ ...record, _offline: true }, ...existing]));
}

/**
 * Reads locally cached records.
 * In live mode always returns [] so Supabase is the only data source.
 */
export function getLocalFallback(key: string): any[] {
  if (!DEMO_MODE) return [];
  return JSON.parse(localStorage.getItem(key) || "[]");
}

/**
 * Merges live Supabase data with local offline cache.
 * In live mode passes remote data straight through without mixing local cache.
 */
export function mergeWithLocal(key: string, remoteData: any[]): any[] {
  if (!DEMO_MODE) return remoteData;
  const local = getLocalFallback(key);
  // Deduplicate by id so synced records don't appear twice after Supabase comes back
  const remoteIds = new Set(remoteData.map((r) => r.id));
  const uniqueLocal = local.filter((l) => !remoteIds.has(l.id));
  return [...uniqueLocal, ...remoteData];
}
