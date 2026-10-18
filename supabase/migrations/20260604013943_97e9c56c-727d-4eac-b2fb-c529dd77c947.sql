
-- bookings additions
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS room_unit_id uuid,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_out_at timestamptz;

-- booking history
CREATE TABLE IF NOT EXISTS public.booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.booking_history TO authenticated;
GRANT ALL ON public.booking_history TO service_role;
ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_staff_read" ON public.booking_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk'));
CREATE POLICY "history_staff_insert" ON public.booking_history
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk'));

-- shifts
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  role app_role NOT NULL,
  assigned_to uuid,
  assigned_name text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_staff_read" ON public.shifts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "shifts_managers_write" ON public.shifts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger
  LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS shifts_touch ON public.shifts;
CREATE TRIGGER shifts_touch BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- realtime
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.room_units REPLICA IDENTITY FULL;
ALTER TABLE public.housekeeping_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.shifts REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shifts';
  IF NOT FOUND THEN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts'; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='room_units';
  IF NOT FOUND THEN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_units'; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='housekeeping_tasks';
  IF NOT FOUND THEN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks'; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='bookings';
  IF NOT FOUND THEN EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings'; END IF;
END $$;
