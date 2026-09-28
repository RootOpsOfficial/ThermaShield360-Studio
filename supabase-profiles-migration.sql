-- ==============================================================================
-- THERMASHIELD 360 — AUTHENTICATION, USER PROFILES & ONBOARDING MIGRATION
-- Platform: Supabase PostgreSQL 15+
-- Safe & Idempotent Migration for:
-- 1. profiles
-- 2. user_onboarding
-- 3. institutional_access_requests
-- 4. institutional_approval_configs
--
-- This script does NOT modify or drop any existing tables (wards, 
-- civic_protection_assets, healthcare_facilities, municipal_alerts, etc.)
-- ==============================================================================

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLE: profiles (Authoritative Role & Approval Status)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT 'User',
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'worker', 'municipal', 'healthcare', 'disaster_management')),
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'disabled')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
INSERT INTO public.institutional_approval_configs (role, role_label, authorized_approver_emails, allowed_email_domains, auto_approve_domains, notification_email)
VALUES 
('municipal', 'Municipal Corporation', ARRAY['commissioner@pmc.gov.in', 'director.disaster@pmc.gov.in'], ARRAY['gov.in', 'pmc.gov.in', 'nic.in'], FALSE, 'municipal-approvals@thermashield.org'),
('healthcare', 'Healthcare Grid', ARRAY['cmo@sgh-hospital.org', 'director.health@maharashtra.gov.in'], ARRAY['hospital.org', 'health.gov.in', 'aiims.edu'], FALSE, 'healthcare-approvals@thermashield.org'),
('disaster_management', 'Disaster Management Authority', ARRAY['commander@ddma-eoc.gov.in', 'operations@ndma.gov.in'], ARRAY['eoc.gov.in', 'ndma.gov.in', 'gov.in'], FALSE, 'disaster-approvals@thermashield.org')
ON CONFLICT (role) DO UPDATE SET
    role_label = EXCLUDED.role_label,
    notification_email = EXCLUDED.notification_email;

-- 6. ROW LEVEL SECURITY POLICIES

-- Policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile on signup" ON public.profiles;
CREATE POLICY "Users can insert own profile on signup"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Security constraint: Users cannot elevate their own role or approval status through client RLS!
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND approval_status = (SELECT p.approval_status FROM public.profiles p WHERE p.id = auth.uid())
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
-- Anyone (even unauthenticated) can submit an access request
DROP POLICY IF EXISTS "Anyone can submit access request" ON public.institutional_access_requests;
CREATE POLICY "Anyone can submit access request"
    ON public.institutional_access_requests FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Users can view their own request by email or ID
DROP POLICY IF EXISTS "Users can view own request" ON public.institutional_access_requests;
CREATE POLICY "Users can view own request"
    ON public.institutional_access_requests FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access on institutional_access_requests" ON public.institutional_access_requests;
CREATE POLICY "Service role full access on institutional_access_requests"
    ON public.institutional_access_requests FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policies for institutional_approval_configs
DROP POLICY IF EXISTS "Public can read approval configs" ON public.institutional_approval_configs;
CREATE POLICY "Public can read approval configs"
    ON public.institutional_approval_configs FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Service role full access on institutional_approval_configs" ON public.institutional_approval_configs;
CREATE POLICY "Service role full access on institutional_approval_configs"
    ON public.institutional_approval_configs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. AUTOMATIC USER CREATION TRIGGER FROM Supabase Auth
-- Automatically creates a profile row in public.profiles when an auth.users record is created (via email or Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    initial_role TEXT;
    initial_status TEXT;
    extracted_name TEXT;
BEGIN
    -- Determine role from user metadata if provided, otherwise default to 'citizen'
    initial_role := COALESCE(NEW.raw_user_meta_data->>'role', 'citizen');
    IF initial_role NOT IN ('citizen', 'worker', 'municipal', 'healthcare', 'disaster_management') THEN
        initial_role := 'citizen';
    END IF;

    -- Institutional roles default to 'pending' unless explicitly approved
    IF initial_role IN ('municipal', 'healthcare', 'disaster_management') THEN
        initial_status := 'pending';
    ELSE
        initial_status := 'approved';
    END IF;

    -- Extract full name from Google OAuth (name or full_name) or email
    extracted_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, full_name, role, approval_status, onboarding_completed)
    VALUES (
        NEW.id,
        NEW.email,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
