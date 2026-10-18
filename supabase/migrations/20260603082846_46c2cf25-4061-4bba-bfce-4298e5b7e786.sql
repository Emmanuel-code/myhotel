
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('owner','gm','front_desk','housekeeping','restaurant','spa','marketing');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE POLICY "users_view_own_roles" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm'));

CREATE POLICY "owners_manage_roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

-- ============ EXTEND EXISTING POLICIES (staff read access) ============
CREATE POLICY "staff_view_all_bookings" ON public.bookings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk'));

CREATE POLICY "staff_update_bookings" ON public.bookings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk'));

CREATE POLICY "staff_view_all_invoices" ON public.invoices FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk'));

CREATE POLICY "staff_view_all_profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk'));

-- ============ ROOM INVENTORY ============
CREATE TABLE public.room_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  room_name text NOT NULL,
  unit_number text NOT NULL,
  floor int,
  status text NOT NULL DEFAULT 'clean', -- clean, dirty, inspected, out_of_order, occupied
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, unit_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_units TO authenticated;
GRANT ALL ON public.room_units TO service_role;
ALTER TABLE public.room_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_units" ON public.room_units FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));
CREATE POLICY "ops_write_units" ON public.room_units FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk') OR public.has_role(auth.uid(),'housekeeping'))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk') OR public.has_role(auth.uid(),'housekeeping'));

-- ============ HOUSEKEEPING TASKS ============
CREATE TABLE public.housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_unit_id uuid REFERENCES public.room_units(id) ON DELETE CASCADE,
  task_type text NOT NULL DEFAULT 'turnover', -- turnover, deep_clean, turndown, maintenance
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'pending', -- pending, in_progress, done
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.housekeeping_tasks TO authenticated;
GRANT ALL ON public.housekeeping_tasks TO service_role;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hk_read" ON public.housekeeping_tasks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'front_desk') OR public.has_role(auth.uid(),'housekeeping'));
CREATE POLICY "hk_write" ON public.housekeeping_tasks FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'housekeeping'))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'housekeeping'));

-- ============ RESTAURANT RESERVATIONS ============
CREATE TABLE public.restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  party_size int NOT NULL DEFAULT 2,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  venue text NOT NULL DEFAULT 'L Étoile',
  status text NOT NULL DEFAULT 'confirmed', -- confirmed, seated, completed, cancelled, no_show
  special_requests text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_reservations TO authenticated;
GRANT ALL ON public.restaurant_reservations TO service_role;
ALTER TABLE public.restaurant_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rest_guest_insert" ON public.restaurant_reservations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rest_guest_read_own" ON public.restaurant_reservations FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "rest_staff_read" ON public.restaurant_reservations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'restaurant') OR public.has_role(auth.uid(),'front_desk'));
CREATE POLICY "rest_staff_write" ON public.restaurant_reservations FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'restaurant'))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'restaurant'));

-- ============ SPA APPOINTMENTS ============
CREATE TABLE public.spa_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text,
  treatment text NOT NULL,
  therapist text,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'confirmed',
  price int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spa_appointments TO authenticated;
GRANT ALL ON public.spa_appointments TO service_role;
ALTER TABLE public.spa_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spa_guest_insert" ON public.spa_appointments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spa_guest_read_own" ON public.spa_appointments FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "spa_staff_read" ON public.spa_appointments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'spa') OR public.has_role(auth.uid(),'front_desk'));
CREATE POLICY "spa_staff_write" ON public.spa_appointments FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'spa'))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'spa'));

-- ============ PROMOTIONS / CAMPAIGNS ============
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  discount_pct int NOT NULL DEFAULT 0,
  starts_at date,
  ends_at date,
  active boolean NOT NULL DEFAULT true,
  audience text DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos_public_read" ON public.promotions FOR SELECT USING (active = true);
CREATE POLICY "promos_staff_all" ON public.promotions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'marketing'))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'marketing'));

-- ============ CMS PAGES ============
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  hero_eyebrow text,
  hero_heading text,
  hero_subheading text,
  body jsonb DEFAULT '{}'::jsonb,
  published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_public_read" ON public.cms_pages FOR SELECT USING (published = true);
CREATE POLICY "cms_staff_all" ON public.cms_pages FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'marketing'))
WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'gm') OR public.has_role(auth.uid(),'marketing'));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_role public.app_role,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (audience_role IS NOT NULL AND public.has_role(auth.uid(), audience_role)));
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR (audience_role IS NOT NULL AND public.has_role(auth.uid(), audience_role)));
CREATE POLICY "notif_insert_staff" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

-- ============ AI CONCIERGE MESSAGES ============
CREATE TABLE public.concierge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL, -- user | assistant
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.concierge_messages TO authenticated;
GRANT ALL ON public.concierge_messages TO service_role;
ALTER TABLE public.concierge_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "concierge_own" ON public.concierge_messages FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_units;
