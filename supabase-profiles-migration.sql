-- ==============================================================================
-- THERMASHIELD 360 — AUTHENTICATION, USER PROFILES & ONBOARDING MIGRATION (FINAL SECURE)
-- Platform: Supabase PostgreSQL 15+
-- Safe & Idempotent Migration for:
-- 1. profiles
-- 2. user_onboarding
-- 3. institutional_access_requests
-- 4. institutional_approval_configs
--
-- SAFETY GUARANTEES:
-- - This script does NOT modify, drop, or delete any of the 9 existing master tables:
--   (wards, ward_demographics, civic_protection_assets, healthcare_facilities,
--    municipal_action_queue, municipal_alerts, weather_observations,
--    weather_forecasts, ward_risk_snapshots)
-- - Zero DROP TABLE, TRUNCATE, or DELETE operations on data.
-- - No fake or placeholder approver emails inserted.
-- - Authorized approver for testing/demo explicitly configured as: rootopsofficial@gmail.com
-- - No client role escalation allowed.
-- - No direct client INSERT into public.profiles (handle_new_user trigger only).
-- - No direct client INSERT into institutional_access_requests (backend service_role insertion only).
-- - No public SELECT data leaks on access requests or approval configs.
-- - Explicit safe search_path = public on all SECURITY DEFINER functions.
-- ==============================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. TABLE: profiles (Authoritative Role & Approval Status)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT 'User',
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'worker', 'municipal', 'healthcare', 'disaster_management')),
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'disabled')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    organization TEXT,
    department TEXT,
    city TEXT DEFAULT 'Pune',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function & Trigger to prevent client role and approval_status escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If update is initiated by a standard authenticated user session, block modifying role and approval_status
    IF auth.uid() IS NOT NULL THEN
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            RAISE EXCEPTION 'Unauthorized: Direct modification of profile role is forbidden.';
        END IF;
        IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
            RAISE EXCEPTION 'Unauthorized: Direct modification of approval_status is forbidden.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- 3. TABLE: user_onboarding (Dynamic multi-role onboarding responses)
CREATE TABLE IF NOT EXISTS public.user_onboarding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    area_type TEXT,
    work_environment TEXT,
    occupation TEXT,
    outdoor_exposure TEXT,
    peak_sun_exposure TEXT,
    age_group TEXT,
    cooling_access TEXT,
    organization TEXT,
    department TEXT,
    operational_area TEXT,
    facility_type TEXT,
    facility_capacity TEXT,
    responsibilities TEXT,
    monitoring_preferences TEXT[] DEFAULT '{}',
    alert_preferences TEXT[] DEFAULT '{}',
    work_hours TEXT,
    water_access TEXT,
    rest_area_access TEXT,
    physical_demand TEXT,
    clinical_catchment TEXT,
    eoc_location TEXT,
    early_warning_lead TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Index for user_onboarding
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON public.user_onboarding(user_id);

-- Trigger for user_onboarding updated_at
DROP TRIGGER IF EXISTS trg_user_onboarding_updated_at ON public.user_onboarding;
CREATE TRIGGER trg_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. TABLE: institutional_access_requests (Municipal, Healthcare, Disaster Management Approvals)
CREATE TABLE IF NOT EXISTS public.institutional_access_requests (
    id TEXT PRIMARY KEY DEFAULT ('req_' || replace(gen_random_uuid()::text, '-', '')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('municipal', 'healthcare', 'disaster_management')),
    organization TEXT NOT NULL,
    department TEXT NOT NULL,
    city_district TEXT NOT NULL,
    contact_phone TEXT,
    official_id_reference TEXT,
    justification TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on institutional_access_requests
ALTER TABLE public.institutional_access_requests ENABLE ROW LEVEL SECURITY;

-- Indexes for access requests
CREATE INDEX IF NOT EXISTS idx_inst_requests_email ON public.institutional_access_requests(email);
CREATE INDEX IF NOT EXISTS idx_inst_requests_status ON public.institutional_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_inst_requests_role ON public.institutional_access_requests(requested_role);

-- Safe unique partial index: prevents multiple concurrent pending requests for the same email and role
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_pending_request
ON public.institutional_access_requests(email, requested_role)
WHERE status = 'pending';

-- Trigger for institutional_access_requests updated_at
DROP TRIGGER IF EXISTS trg_inst_requests_updated_at ON public.institutional_access_requests;
CREATE TRIGGER trg_inst_requests_updated_at
BEFORE UPDATE ON public.institutional_access_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. TABLE: institutional_approval_configs (Configurable approval authorities and domains)
CREATE TABLE IF NOT EXISTS public.institutional_approval_configs (
    role TEXT PRIMARY KEY CHECK (role IN ('municipal', 'healthcare', 'disaster_management')),
    role_label TEXT NOT NULL,
    authorized_approver_emails TEXT[] NOT NULL DEFAULT '{}',
    allowed_email_domains TEXT[] NOT NULL DEFAULT '{}',
    auto_approve_domains BOOLEAN NOT NULL DEFAULT FALSE,
    notification_email TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on institutional_approval_configs
ALTER TABLE public.institutional_approval_configs ENABLE ROW LEVEL SECURITY;

-- Seed default institutional approval configurations
-- Explicitly configures rootopsofficial@gmail.com as the authorized approver for all institutional tiers
INSERT INTO public.institutional_approval_configs (role, role_label, authorized_approver_emails, allowed_email_domains, auto_approve_domains, notification_email)
VALUES 
('municipal', 'Municipal Corporation', ARRAY['rootopsofficial@gmail.com'], ARRAY[]::TEXT[], FALSE, NULL),
('healthcare', 'Healthcare Grid', ARRAY['rootopsofficial@gmail.com'], ARRAY[]::TEXT[], FALSE, NULL),
('disaster_management', 'Disaster Management Authority', ARRAY['rootopsofficial@gmail.com'], ARRAY[]::TEXT[], FALSE, NULL)
ON CONFLICT (role) DO UPDATE SET
    role_label = EXCLUDED.role_label,
    authorized_approver_emails = EXCLUDED.authorized_approver_emails,
    updated_at = NOW();

-- 6. ROW LEVEL SECURITY POLICIES

-- Policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- HARDENING: Normal authenticated clients CANNOT directly insert into public.profiles.
-- All profile creation is strictly and authoritatively handled by the handle_new_user() trigger on auth.users.
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON public.profiles;

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND approval_status IS NOT DISTINCT FROM (SELECT p.approval_status FROM public.profiles p WHERE p.id = auth.uid())
        AND onboarding_completed IS NOT DISTINCT FROM (SELECT p.onboarding_completed FROM public.profiles p WHERE p.id = auth.uid())
        AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    );

-- Allow service role full access to profiles
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
    ON public.profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies for user_onboarding
DROP POLICY IF EXISTS "Users can read own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can read own onboarding"
    ON public.user_onboarding FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can insert own onboarding"
    ON public.user_onboarding FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can update own onboarding"
    ON public.user_onboarding FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on user_onboarding" ON public.user_onboarding;
CREATE POLICY "Service role full access on user_onboarding"
    ON public.user_onboarding FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies for institutional_access_requests
-- HARDENING: Anonymous and normal authenticated users CANNOT directly insert into this table.
-- All insertions are executed through the backend server endpoint using the service_role key.
DROP POLICY IF EXISTS "Anyone can submit access request" ON public.institutional_access_requests;

-- PRIVACY FIX: Authenticated users can ONLY read their own submitted request by verified email from auth JWT!
-- NEVER USING (true) for SELECT on institutional requests!
DROP POLICY IF EXISTS "Users can view own request" ON public.institutional_access_requests;
CREATE POLICY "Users can view own request"
    ON public.institutional_access_requests FOR SELECT
    TO authenticated
    USING (LOWER(email) = LOWER(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Service role full access on institutional_access_requests" ON public.institutional_access_requests;
CREATE POLICY "Service role full access on institutional_access_requests"
    ON public.institutional_access_requests FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies for institutional_approval_configs
-- PRIVACY FIX: NEVER allow public anonymous or normal authenticated read of approver configs!
DROP POLICY IF EXISTS "Public can read approval configs" ON public.institutional_approval_configs;

DROP POLICY IF EXISTS "Service role full access on institutional_approval_configs" ON public.institutional_approval_configs;
CREATE POLICY "Service role full access on institutional_approval_configs"
    ON public.institutional_approval_configs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. AUTOMATIC USER CREATION TRIGGER FROM Supabase Auth
-- Trigger strictly enforces role assignment:
-- Institutional roles are ONLY granted if:
-- 1. The Supabase Auth user's email is verified (email_confirmed_at IS NOT NULL), AND
-- 2. An exact normalized email match has an already APPROVED institutional request.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_role TEXT;
    initial_status TEXT;
    extracted_name TEXT;
    approved_role TEXT;
BEGIN
    -- Only check for institutional elevation if the user's email is verified in auth.users
    IF NEW.email_confirmed_at IS NOT NULL THEN
        SELECT requested_role INTO approved_role
        FROM public.institutional_access_requests
        WHERE LOWER(email) = LOWER(NEW.email) AND status = 'approved'
        ORDER BY reviewed_at DESC
        LIMIT 1;
    END IF;

    IF approved_role IS NOT NULL THEN
        -- Elevated through verified institutional approval with confirmed email
        initial_role := approved_role;
        initial_status := 'approved';
    ELSE
        -- Public registration: ONLY 'citizen' or 'worker' permitted
        IF NEW.raw_user_meta_data->>'role' = 'worker' THEN
            initial_role := 'worker';
        ELSE
            initial_role := 'citizen';
        END IF;
        initial_status := 'approved';
    END IF;

    -- Extract full name from OAuth or metadata or email
    extracted_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, full_name, role, approval_status, onboarding_completed)
    VALUES (
        NEW.id,
        LOWER(NEW.email),
        extracted_name,
        initial_role,
        initial_status,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE 
            WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = 'User' THEN EXCLUDED.full_name 
            ELSE public.profiles.full_name 
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. AUTOMATIC PROFILE ELEVATION ON EMAIL CONFIRMATION
-- When an unverified user confirms their email in Supabase Auth, check for an APPROVED institutional request
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    approved_role TEXT;
BEGIN
    -- Only act when email_confirmed_at transitions from NULL to verified timestamp
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        SELECT requested_role INTO approved_role
        FROM public.institutional_access_requests
        WHERE LOWER(email) = LOWER(NEW.email) AND status = 'approved'
        ORDER BY reviewed_at DESC
        LIMIT 1;

        IF approved_role IS NOT NULL THEN
            UPDATE public.profiles
            SET role = approved_role,
                approval_status = 'approved',
                updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users for email confirmation updates
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();
