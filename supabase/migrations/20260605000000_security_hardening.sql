-- ========================================================
-- SECURITY HARDENING MIGRATION
-- Fixes:
-- 1. Single owner constraint and atomic claim RPC
-- 2. Loyalty tier/points client tampering prevention trigger
-- 3. Hardened booking policies and verified loyalty calculation
-- ========================================================

-- 1. Ensure only one owner can exist across the platform
CREATE UNIQUE INDEX IF NOT EXISTS unique_single_owner_idx 
ON public.user_roles (role) 
WHERE role = 'owner';

-- 2. Atomic claim function executing in a single advisory-locked transaction
CREATE OR REPLACE FUNCTION public.claim_initial_ownership(claimant_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_exists boolean;
  r public.app_role;
BEGIN
  -- Obtain exclusive transaction-level lock to eliminate TOCTOU race conditions
  PERFORM pg_advisory_xact_lock(847294829);

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'owner'
  ) INTO v_owner_exists;

  IF v_owner_exists THEN
    RETURN false;
  END IF;

  FOREACH r IN ARRAY ARRAY['owner','gm','front_desk','housekeeping','restaurant','spa','marketing']::public.app_role[]
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (claimant_id, r)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_initial_ownership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_initial_ownership(uuid) TO service_role;

-- 3. Profile Integrity Trigger: Prevent authenticated users from tampering with loyalty tier/points
CREATE OR REPLACE FUNCTION public.enforce_profile_column_integrity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'gm')
  ) THEN
    IF NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points OR
       NEW.loyalty_tier IS DISTINCT FROM OLD.loyalty_tier THEN
      RAISE EXCEPTION 'Unauthorized modification of loyalty points or tier.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_integrity ON public.profiles;
CREATE TRIGGER trg_enforce_profile_integrity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_column_integrity();

-- 4. Secure Booking State Transitions & Loyalty Accrual
-- Replace unverified on_booking_created with verified payment transition
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
DROP FUNCTION IF EXISTS public.after_booking_insert();

CREATE OR REPLACE FUNCTION public.handle_booking_invoice_and_loyalty()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  earned INTEGER;
BEGIN
  -- Only generate invoice and award loyalty points when status is confirmed
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status <> 'confirmed')) THEN
    -- Ensure invoice is created only once per booking
    IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE booking_id = NEW.id) THEN
      INSERT INTO public.invoices (booking_id, user_id, invoice_number, amount, currency, line_items)
      VALUES (
        NEW.id,
        NEW.user_id,
        'INV-' || to_char(now(),'YYYYMM') || '-' || upper(substr(NEW.id::text,1,8)),
        NEW.total,
        NEW.currency,
        jsonb_build_array(
          jsonb_build_object('label', NEW.room_name || ' × ' || NEW.nights || ' nights', 'amount', NEW.room_total),
          jsonb_build_object('label', 'Extras', 'amount', NEW.extras_total),
          jsonb_build_object('label', 'Taxes & service', 'amount', NEW.taxes)
        )
      );
    END IF;

    -- Award loyalty points safely (capped against negative/overflow values)
    earned := LEAST(100000, GREATEST(0, NEW.total / 10));
    UPDATE public.profiles
      SET loyalty_points = loyalty_points + earned,
          loyalty_tier = CASE
            WHEN loyalty_points + earned >= 5000 THEN 'Diamond'
            WHEN loyalty_points + earned >= 2000 THEN 'Platinum'
            WHEN loyalty_points + earned >= 500 THEN 'Gold'
            ELSE 'Silver'
          END,
          updated_at = now()
      WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_booking_invoice_and_loyalty() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_booking_status_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_invoice_and_loyalty();

-- 5. Harden Bookings RLS Policies
DROP POLICY IF EXISTS "bookings_update_own" ON public.bookings;
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Users cannot manipulate status or total directly once created
    AND (
      public.has_role(auth.uid(), 'owner') 
      OR public.has_role(auth.uid(), 'gm') 
      OR public.has_role(auth.uid(), 'front_desk')
      OR (status = (SELECT b.status FROM public.bookings b WHERE b.id = bookings.id)
          AND total = (SELECT b.total FROM public.bookings b WHERE b.id = bookings.id))
    )
  );
